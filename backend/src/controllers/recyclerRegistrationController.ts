import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerRegistrationController {
  /**
   * Submit recycler registration
   */
  static async submitRegistration(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const {
        name,
        email,
        phone,
        countryCode,
        certificateImage,
        region,
        city,
        transportType,
        truckPlate,
        address,
        idFront,
        idBack,
        idNo,
        profileImage
      } = req.body;

      if (!name || !email || !phone || !region || !city) {
        res.status(400).json({
          success: false,
          error: 'Name, email, phone, region, and city are required'
        });
        return;
      }

      // Update user profile with registration data
      const { data: user, error: userError } = await supabase
        .from('users')
        .update({
          username: name,
          email: email,
          phone: phone,
          role: 'recycler',
          profile_image: profileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (userError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update user profile'
        });
        return;
      }

      // Create recycler profile
      const { data: recyclerProfile, error: profileError } = await supabase
        .from('recycler_profiles')
        .insert({
          user_id: userId,
          business_name: name,
          business_license: certificateImage,
          service_areas: [region, city],
          vehicle_type: transportType,
          vehicle_number: truckPlate,
          experience_years: 0,
          is_verified: false,
          is_available: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        res.status(500).json({
          success: false,
          error: 'Failed to create recycler profile'
        });
        return;
      }

      // Create registration record
      const { data: registration, error: registrationError } = await supabase
        .from('recycler_registrations')
        .insert({
          user_id: userId,
          status: 'pending',
          documents: {
            certificate: certificateImage,
            id_front: idFront,
            id_back: idBack,
            id_number: idNo,
            profile_image: profileImage
          },
          personal_info: {
            name,
            email,
            phone,
            country_code: countryCode,
            address
          },
          service_info: {
            region,
            city,
            transport_type: transportType,
            truck_plate: truckPlate
          },
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (registrationError) {
        res.status(500).json({
          success: false,
          error: 'Failed to create registration record'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user,
          recyclerProfile,
          registration
        },
        message: 'Registration submitted successfully. Pending review.'
      });
    } catch (error) {
      console.error('Error submitting registration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit registration'
      });
    }
  }

  /**
   * Get registration status
   */
  static async getRegistrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { data: registration, error } = await supabase
        .from('recycler_registrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        res.status(500).json({
          success: false,
          error: 'Failed to get registration status'
        });
        return;
      }

      if (!registration) {
        res.json({
          success: true,
          data: {
            status: 'not_registered',
            message: 'No registration found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          status: registration.status,
          submittedAt: registration.submitted_at,
          reviewedAt: registration.reviewed_at,
          message: registration.status === 'pending' 
            ? 'Registration is under review. You\'ll receive an update within 48-72 hours.'
            : registration.status === 'approved'
            ? 'Registration approved! You can now start accepting pickup requests.'
            : 'Registration was rejected. Please review and resubmit.'
        }
      });
    } catch (error) {
      console.error('Error getting registration status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get registration status'
      });
    }
  }

  /**
   * Update registration details
   */
  static async updateRegistration(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const updateData = req.body;

      const { data: registration, error } = await supabase
        .from('recycler_registrations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to update registration'
        });
        return;
      }

      res.json({
        success: true,
        data: registration,
        message: 'Registration updated successfully'
      });
    } catch (error) {
      console.error('Error updating registration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update registration'
      });
    }
  }

  /**
   * Upload registration documents
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { documentType, documentUrl } = req.body;

      if (!documentType || !documentUrl) {
        res.status(400).json({
          success: false,
          error: 'Document type and URL are required'
        });
        return;
      }

      // Get current registration first
      const { data: currentRegistration, error: getError } = await supabase
        .from('recycler_registrations')
        .select('documents')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (getError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get current registration'
        });
        return;
      }

      // Update registration with new document
      const { data: updatedRegistration, error } = await supabase
        .from('recycler_registrations')
        .update({
          documents: {
            ...currentRegistration?.documents,
            [documentType]: documentUrl
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to upload document'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedRegistration,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload document'
      });
    }
  }

  /**
   * Get available regions and cities
   */
  static async getRegions(req: Request, res: Response): Promise<void> {
    try {
      const regions = {
        'Ashanti': [
          'Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong',
          'Asokwa', 'Bantama', 'Asokore Mampong', 'Tafo', 'Suame',
          'Kwadaso', 'Oforikrom', 'Atwima', 'Bekwai', 'Effiduase',
          'Agona', 'Fomena', 'Juaben', 'Nsuta', 'Atonsu',
          'Aboabo', 'Manhyia', 'Asafo', 'Bompata', 'Afigya Kwabre',
          'Bosomtwe', 'Kuntanase', 'Kokofu', 'Asante Akim', 'Obuasi East',
          'Adansi', 'Kumawu', 'Bosome', 'Juaso', 'Manso Nkwanta'
        ],
        'Greater Accra': [
          'Accra', 'Tema', 'Madina', 'Teshie', 'Nungua',
          'Ashaiman', 'Dansoman', 'Adenta', 'Spintex', 'Osu',
          'East Legon', 'Labadi', 'Kaneshie', 'Dome', 'Lapaz',
          'Amasaman', 'Achimota', 'Ridge', 'Airport Residential', 'Sakumono',
          'Kasoa', 'Kwabenya', 'Gbawe', 'Weija', 'Mallam',
          'Abeka', 'Odorkor', 'Chorkor', 'La', 'Mamprobi',
          'New Town', 'North Kaneshie', 'North Legon', 'Bubuashie', 'Awoshie',
          'Tesano', 'Kokomlemle', 'Dzorwulu', 'Haatso', 'Abelemkpe',
          'Burma Camp', 'Kanda', 'Roman Ridge', 'West Legon', 'Sowutuom',
          'McCarthy Hill', 'Oyarifa', 'Pokuase', 'Ashaley Botwe', 'Santeo',
          'Avenor', 'Korle Gonno', 'Mamobi', 'Alajo', 'Abossey Okai',
          'Odorna', 'Kwashieman', 'Tudu', 'Kokompe', 'Kwashieman',
          'Bortianor', 'Glefe', 'Sakaman', 'Santa Maria', 'Tabora',
          'Kotobabi', 'Kpehe', 'Kokomlemle', 'Nima', 'Pig Farm',
          'Kokomlemle', 'Kanda', 'Roman Ridge', 'West Legon', 'Sowutuom'
        ],
        'Western': [
          'Sekondi', 'Takoradi', 'Tarkwa', 'Axim', 'Shama',
          'Prestea', 'Bogoso', 'Half Assini', 'Mpohor', 'Wiawso',
          'Essiama', 'Nzema', 'Elubo', 'Agona Nkwanta', 'Daboase',
          'Beyin', 'Esiama', 'Sefwi', 'Aiyinase', 'Asankragwa'
        ],
        'Central': [
          'Cape Coast', 'Winneba', 'Mankessim', 'Saltpond', 'Elmina',
          'Agona Swedru', 'Twifo Praso', 'Assin Fosu', 'Kasoa', 'Abura Dunkwa',
          'Yamoransa', 'Breman Asikuma', 'Komenda', 'Moree', 'Anomabo',
          'Awutu', 'Bawjiase', 'Jukwa', 'Ajumako', 'Asebu',
          'Nsaba', 'Odoben', 'Abakrampa', 'Assin Manso', 'Gomoa Fetteh'
        ],
        'Eastern': [
          'Koforidua', 'Nkawkaw', 'Akim Oda', 'Suhum', 'Nsawam',
          'Akim Swedru', 'Aburi', 'Mpraeso', 'Akim Tafo', 'Begoro',
          'Akim Manso', 'Asamankese', 'Donkorkrom', 'Kwahu', 'Ofoase',
          'Akwatia', 'New Abirem', 'Akim Akroso', 'Akim Oda', 'Akim Ofoase'
        ],
        'Volta': [
          'Ho', 'Kpando', 'Hohoe', 'Aflao', 'Keta',
          'Anloga', 'Akatsi', 'Sogakope', 'Denu', 'Krachi',
          'Kete Krachi', 'Nkwanta', 'Jasikan', 'Kpando', 'Adidome',
          'Dzodze', 'Peki', 'Kpedze', 'Wli', 'Agbozume'
        ],
        'Northern': [
          'Tamale', 'Yendi', 'Savelugu', 'Gushegu', 'Bimbilla',
          'Karaga', 'Saboba', 'Wulensi', 'Kpandai', 'Tolon',
          'Sagnarigu', 'Tatale', 'Chereponi', 'Salaga', 'Buipe',
          'Damongo', 'Sawla', 'Kumbungu', 'Mion', 'Zabzugu'
        ],
        'Upper East': [
          'Bolgatanga', 'Bawku', 'Navrongo', 'Zebilla', 'Sandema',
          'Paga', 'Garu', 'Binduri', 'Bongo', 'Tongo',
          'Chiana', 'Pusiga', 'Tempane', 'Bawku West', 'Kassena Nankana',
          'Fumbisi', 'Sirigu', 'Gambibgo', 'Gbedema', 'Kologo'
        ],
        'Upper West': [
          'Wa', 'Nandom', 'Tumu', 'Lawra', 'Jirapa',
          'Lambussie', 'Nadowli', 'Funsi', 'Wechiau', 'Gwollu',
          'Hain', 'Kaleo', 'Dorimon', 'Eremon', 'Babile'
        ],
        'Brong-Ahafo': [
          'Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro', 'Wenchi',
          'Kintampo', 'Atebubu', 'Nkoranza', 'Yeji', 'Bechem',
          'Duayaw Nkwanta', 'Goaso', 'Hwidiem', 'Kenayasi', 'Sampa',
          'Seikwa', 'Drobo', 'Japekrom', 'Acherensua', 'Fiapre'
        ],
        'Bono': [
          'Sunyani', 'Berekum', 'Dormaa Ahenkro', 'Wenchi', 'Techiman',
          'Sampa', 'Seikwa', 'Drobo', 'Japekrom', 'Acherensua',
          'Fiapre', 'Kwatire', 'Nsoatre', 'Chiraa', 'Banda'
        ],
        'Bono East': [
          'Techiman', 'Kintampo', 'Atebubu', 'Nkoranza', 'Yeji',
          'Prang', 'Kwame Danso', 'Akomadan', 'Tuobodom', 'Atebubu Amantin',
          'Zabrama', 'Abease', 'Ejura', 'Afram Plains', 'Kojokrom'
        ],
        'Ahafo': [
          'Goaso', 'Hwidiem', 'Bechem', 'Kenyasi', 'Duayaw Nkwanta',
          'Mim', 'Kukuom', 'Acherensua', 'Ayomso', 'Nkaseim',
          'Yamfo', 'Tanoso', 'Asutifi', 'Akrodie', 'Kwapong'
        ],
        'Western North': [
          'Sefwi Wiawso', 'Bibiani', 'Juaboso', 'Enchi', 'Awaso',
          'Akontombra', 'Bodi', 'Suhyenso', 'Essam', 'Adabokrom',
          'Boinzan', 'Anhwiaso', 'Bekwai', 'Sefwi Bekwai', 'Sefwi Akontombra'
        ],
        'Savannah': [
          'Damongo', 'Salaga', 'Bole', 'Sawla', 'Daboya',
          'Busunu', 'Larabanga', 'Tuna', 'Kpalbe', 'Kpandai',
          'Fufulso', 'Mankarigu', 'Labile', 'Kpembe', 'Kpalbe'
        ],
        'Oti Region': [
          'Dambai', 'Nkwanta', 'Krachi', 'Kadjebi', 'Kete Krachi',
          'Jasikan', 'Kpassa', 'Nkonya', 'Worawora', 'Brewaniase',
          'Dodi Papase', 'Akan', 'Krachi Nchumuru', 'Krachi West', 'Krachi East'
        ]
      };

      res.json({
        success: true,
        data: regions,
        message: 'Regions and cities retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting regions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get regions'
      });
    }
  }
} 